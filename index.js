const puperteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config()
const filePath = path.join(__dirname, 'result.json');
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;

const writeFile = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const sleep = (ms) => {
    console.log(`Đang chờ ${ms}ms...`);
    return new Promise((resolve) => setTimeout(resolve, ms));
};


const start = async () => {
    const browser = await puperteer.launch({
        // headless: false,
    });
    const page = await browser.newPage();
    await page.goto('https://login.xing.com/?dest_url=/profile/Kazim_Jawad');
    await sleep(5000);
    await page.waitForSelector('#usercentrics-root');
    await sleep(5000);
    const shadowHost = await page.$('#usercentrics-root');
    if (shadowHost) {
        const shadowRoot = await page.evaluateHandle(
            (host) => host.shadowRoot,
            shadowHost
        );

        const acceptButton = await shadowRoot.$('[data-testid=uc-accept-all-button]');

        if (acceptButton) {
            await acceptButton.click();
            console.log('Đã click vào nút accept!');
        } else {
            console.log('Không tìm thấy nút accept!');
        }
    }

    await sleep(3000);



    // Điền thông tin đăng nhập
    console.log('Điền thông tin đăng nhập...');
    await page.waitForSelector('#username');
    await page.type('#username', username, { delay: 100 });

    await page.waitForSelector('#password');
    await page.type('#password', password, { delay: 100 });

    // Nhấn nút "Đăng nhập"
    console.log('Nhấn nút đăng nhập...');
    await page.waitForSelector('.login-form-styled__SubmitButton-sc-23470e24-9.lfJZPD');
    await page.click('.login-form-styled__SubmitButton-sc-23470e24-9.lfJZPD');

    // Chờ xử lý kết quả đăng nhập
    await sleep(5000); // Chờ thêm 5 giây để đảm bảo đăng nhập thành công
    console.log('Đăng nhập hoàn tất!');

    await page.waitForNavigation({ waitUntil: 'networkidle0' }); // Chờ trang chuyển hướng
    console.log('Đã chuyển hướng thành công!');
    await sleep(5000);

    // Nhấp vào nút banner sau chuyển hướng
    await page.waitForSelector('#consent-accept-button', { visible: true }); // Chờ nút xuất hiện
    await page.click('#consent-accept-button');
    console.log('Đã nhấp vào nút accept trên banner!');

    await sleep(1000);

    const result = await page.evaluate(() => {
        const profileLayout = document.querySelector('#profile-xingid-container');
        const skillLayout = document.querySelector('#ProfileSkillsModule div.styles-grid-col-fe83e37b.styles-grid-default12-f22b04ab.styles-grid-wide10-fba8767d > section div')
        const timeLineLayout = document.querySelector('#ProfileTimelineModule div:nth-child(2) > div.styles-grid-col-fe83e37b.styles-grid-default12-f22b04ab.styles-grid-wide10-fba8767d > div')
        const languageLayout = document.querySelectorAll('#ProfileLanguagesModule div.sc-1n5ool6-0.gtzJVK > div')
        const qualificationsLayout = document.querySelectorAll("#AccomplishmentsModule .styles-grid-row-dac13758 > div.cKakGE")
        const [name, level] = profileLayout.querySelector('h1').innerText.split('\n');
        const information = profileLayout.querySelector('div.sc-1fwdvj1-0.dWbpQz > section').innerText;
        const address = profileLayout.querySelector('div.sc-1fwdvj1-0.dWbpQz > span').innerText;
        const numberContact = profileLayout.querySelector('div.sc-1fwdvj1-0.dWbpQz span.ngcj6c-5.lnWRJn > span > strong').innerText;
        const [hardSkillLayout, softSkillLayout] = skillLayout.querySelectorAll('.sc-124sbki-1.izSysB')
        const hardSkill = []
        const softSkill = []
        const timeLine = []
        const languages = []
        const qualifications = []
        hardSkillLayout.querySelectorAll('.cz9s10-7.bASqnU').forEach(item => {
            hardSkill.push(item.innerText)
        })
        softSkillLayout.querySelectorAll('.cz9s10-7.bASqnU').forEach(item => {
            softSkill.push(item.innerText)
        })
        let temp = ''
        timeLineLayout.querySelectorAll('div.js9jm7-0').forEach(item => {
            const categoryDocument = item.querySelector('h2.sc-1gpssxl-0.AHCnG')
            let category

            if (categoryDocument) {
                temp = categoryDocument.innerText
                category = categoryDocument.innerText
            } else {
                category = temp
            }
            const infoOfCategoryDocument = item.querySelectorAll('div.sc-1qewlmx-2.igXmBW')
            infoOfCategoryDocument.forEach(info => {
                const place = info.querySelector('div > p').innerText
                const timeRange = info.querySelector('p.etdIpE').innerText
                const jobName = info.querySelector('h2[data-qa="timeline-headline"]').innerText
                const position = info.querySelector('p.iuYUoN').innerText
                timeLine.push({
                    category, place, timeRange, jobName, position
                })
            })

        })

        languageLayout.forEach(langElement => {
            const language = langElement.querySelector('h2').textContent.trim();
            const level = langElement.querySelector('p.enPFcn').textContent.trim();
            const levelText = langElement.querySelector('p.kZJncE').textContent.trim();
            languages.push({
                language, level, levelText
            })
        })

        qualificationsLayout.forEach(qualificationElement => {
            const time = qualificationElement.querySelector('p.hrSbBD').textContent.trim();
            const qualification = qualificationElement.querySelector('h2.kBiPan').textContent.trim();
            const url = qualificationElement.querySelector('a.lfdwAy').href;
            qualifications.push({
                time, qualification, url
            })
        })
        const iframe = document.querySelector('#tab-content');
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        const otherWebProfiles = Array.from(doc.querySelectorAll('#profiles-tab .item-list li')).map((item) => {
            const name = item.querySelector('h4').textContent.trim();
            const url = item.querySelector('a').href.trim();
            return { name, url };
        });
        const aboutMe = document.querySelector('#ProfileAboutMeModule p.jmrLJu').textContent.trim();
        const hobbies = Array.from(document.querySelectorAll('#ProfileInterestsModule div.cz9s10-0.cTEqee')).map((item) => item.textContent.trim());
        const birthName = document.querySelector('#PersonalDetailsModule div.loYDDK').textContent.trim();
        const [xingMembersince, totalVisit] = document.querySelector('#ProfileStatsModule div.loYDDK').textContent.trim().split(' / ');
        return {
            name, level, information, address, numberContact, hardSkill, softSkill, timeLine, languages, qualifications, otherWebProfiles, aboutMe, hobbies, birthName, xingMembersince, totalVisit
        };

    });
    writeFile(result);

    await browser.close();
}
start().then(() => console.log('done'));